<template>
  <el-dialog
    v-if="dialogVisible"
    :title="formData.id ? '编辑会员等级' : '添加会员等级'"
    :visible.sync="dialogVisible"
    width="620px"
    :before-close="handleClose"
  >
    <el-form :model="formData" :rules="rules" ref="user" label-width="120px" class="demo-ruleForm" v-loading="loading">
      <el-form-item label="等级名称：" prop="name">
        <el-input v-model="formData.name" placeholder="如：创客、联创（仅为展示别名）" maxlength="50" />
      </el-form-item>
      <el-form-item label="等级序号：" prop="grade">
        <el-input-number v-model="formData.grade" :min="1" :max="999" controls-position="right" placeholder="数字越大等级越高" />
        <div class="form-tip">用于排序与升级优先级，联创应大于创客</div>
      </el-form-item>
      <el-form-item label="升级方式：" prop="upgradeType">
        <el-radio-group v-model="formData.upgradeType">
          <el-radio :label="1">累计消费达标</el-radio>
          <el-radio :label="2">单笔订单达标</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item :label="upgradeAmountLabel" prop="experience">
        <el-input-number
          v-model="formData.experience"
          :min="0"
          :precision="0"
          controls-position="right"
          placeholder="请输入金额（元）"
        />
        <div class="form-tip">{{ upgradeAmountTip }}</div>
      </el-form-item>
      <el-form-item label="积分倍数：" prop="integralMultiple">
        <el-input-number
          v-model="formData.integralMultiple"
          :min="0.01"
          :max="99"
          :step="0.1"
          :precision="2"
          controls-position="right"
        />
        <div class="form-tip">下单赠送积分 = 基础积分 × 倍数（业务逻辑后续接入）</div>
      </el-form-item>
      <el-form-item label="直推奖(%)：" prop="directBrokerageRate">
        <el-input-number v-model="formData.directBrokerageRate" :min="0" :max="100" controls-position="right" />
      </el-form-item>
      <el-form-item label="团队奖(%)：" prop="teamBrokerageRate">
        <el-input-number v-model="formData.teamBrokerageRate" :min="0" :max="100" controls-position="right" />
        <div class="form-tip">团队奖比例配置（业务逻辑后续接入）</div>
      </el-form-item>
      <el-form-item label="享受折扣(%)：" prop="discount">
        <el-input-number v-model="formData.discount" :min="1" :max="100" controls-position="right" />
        <div class="form-tip">100 表示无折扣，90 表示九折</div>
      </el-form-item>
      <el-form-item label="等级图标：" prop="icon">
        <div class="upLoadPicBox" @click="modalPicTap('1', 'icon')">
          <div v-if="formData.icon" class="pictrue"><img :src="formData.icon" /></div>
          <div v-else class="upLoad">
            <i class="el-icon-camera cameraIconfont" />
          </div>
        </div>
      </el-form-item>
      <el-form-item label="等级说明：">
        <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="选填，如：累计消费达到126元升级" maxlength="255" />
      </el-form-item>
      <el-form-item v-if="!formData.id" label="启用状态：">
        <el-switch v-model="formData.isShow" active-text="开启" inactive-text="关闭" />
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        @click="submitForm"
        v-hasPermi="['admin:system:user:level:update', 'admin:system:user:level:save']"
        >确定</el-button
      >
    </span>
  </el-dialog>
</template>

<script>
import { levelSaveApi, levelInfoApi, levelUpdateApi } from '@/api/user';
import { Debounce } from '@/utils/validate';

const defaultForm = () => ({
  name: '',
  grade: 1,
  discount: 100,
  experience: 0,
  upgradeType: 1,
  integralMultiple: 1,
  directBrokerageRate: 0,
  teamBrokerageRate: 0,
  icon: '',
  remark: '',
  id: null,
  isShow: true,
});

export default {
  name: 'CreatGrade',
  data() {
    return {
      dialogVisible: false,
      formData: defaultForm(),
      loading: false,
      rules: {
        name: [{ required: true, message: '请输入等级名称', trigger: 'blur' }],
        grade: [{ required: true, message: '请输入等级序号', trigger: 'blur' }],
        upgradeType: [{ required: true, message: '请选择升级方式', trigger: 'change' }],
        discount: [{ required: true, message: '请输入折扣', trigger: 'blur' }],
        experience: [{ required: true, message: '请输入升级金额', trigger: 'blur' }],
        integralMultiple: [{ required: true, message: '请输入积分倍数', trigger: 'blur' }],
        directBrokerageRate: [{ required: true, message: '请输入直推奖比例', trigger: 'blur' }],
        teamBrokerageRate: [{ required: true, message: '请输入团队奖比例', trigger: 'blur' }],
        icon: [{ required: true, message: '请上传等级图标', trigger: 'change' }],
      },
    };
  },
  computed: {
    upgradeAmountLabel() {
      return this.formData.upgradeType === 2 ? '单笔金额(元)：' : '累计消费(元)：';
    },
    upgradeAmountTip() {
      if (this.formData.upgradeType === 2) {
        return '单笔订单实付达到该金额即可升级（如联创 600 元）';
      }
      return '用户累计实付/经验达到该值升级（如创客 126 元）';
    },
  },
  watch: {
    dialogVisible(val) {
      if (val && this.formData.id) {
        this.loadInfo(this.formData.id);
      }
    },
  },
  methods: {
    modalPicTap(tit, num) {
      const _this = this;
      this.$modalUpload(
        function (img) {
          if (tit === '1' && num === 'icon') {
            _this.$set(_this.formData, 'icon', img[0].sattDir);
          }
        },
        tit,
        'user',
      );
    },
    loadInfo(id) {
      this.loading = true;
      levelInfoApi({ id })
        .then((res) => {
          this.formData = {
            ...defaultForm(),
            ...res,
            integralMultiple: res.integralMultiple != null ? Number(res.integralMultiple) : 1,
          };
          this.loading = false;
        })
        .catch(() => {
          this.loading = false;
        });
    },
    handleClose() {
      this.dialogVisible = false;
      this.formData = defaultForm();
      this.$nextTick(() => {
        if (this.$refs.user) {
          this.$refs.user.clearValidate();
        }
      });
    },
    submitForm: Debounce(function () {
      this.$refs.user.validate((valid) => {
        if (!valid) return;
        this.loading = true;
        const data = {
          name: this.formData.name,
          grade: this.formData.grade,
          discount: this.formData.discount,
          experience: this.formData.experience,
          upgradeType: this.formData.upgradeType,
          integralMultiple: this.formData.integralMultiple,
          directBrokerageRate: this.formData.directBrokerageRate,
          teamBrokerageRate: this.formData.teamBrokerageRate,
          icon: this.formData.icon,
          remark: this.formData.remark || '',
          isShow: this.formData.isShow !== false,
        };
        const request = this.formData.id
          ? levelUpdateApi(this.formData.id, data)
          : levelSaveApi(data);
        request
          .then(() => {
            this.$message.success(this.formData.id ? '编辑成功' : '添加成功');
            this.loading = false;
            this.handleClose();
            this.$parent.getList();
          })
          .catch(() => {
            this.loading = false;
          });
      });
    }),
  },
};
</script>

<style scoped lang="scss">
.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  margin-top: 4px;
}
</style>
