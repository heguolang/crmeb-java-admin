<template>
  <div class="divBox">
    <el-card class="box-card mb15" shadow="never">
      <div slot="header"><span>积分到账方式</span></div>
      <el-form label-width="140px" v-loading="timingLoading">
        <el-form-item label="到账方式：">
          <el-radio-group v-model="integralCreditTiming">
            <el-radio label="1">支付订单到账</el-radio>
            <el-radio label="2">订单完成到账</el-radio>
          </el-radio-group>
          <div class="tip">支付订单到账：付款成功立即入账；订单完成到账：用户确认收货后入账</div>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="timingSaving"
            @click="saveTiming"
            v-hasPermi="['admin:system:config:save:form']"
            >保存到账方式</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="box-card">
      <zb-parser
        :form-id="formId"
        :is-create="isCreate"
        :edit-data="editData"
        @submit="handlerSubmit"
        @resetForm="resetForm"
        v-if="isShow"
      />
    </el-card>
  </div>
</template>

<script>
import zbParser from '@/components/FormGenerator/components/parser/ZBParser';
import { configSaveForm, configInfo, configGetUniq, configSaveUniq } from '@/api/systemConfig.js';
import { Debounce } from '@/utils/validate';
import { checkPermi } from '@/utils/permission'; // 权限判断函数
export default {
  name: 'integralconfig',
  components: { zbParser },
  data() {
    return {
      isShow: false,
      isCreate: 0,
      editData: {},
      formId: 109,
      integralCreditTiming: '1',
      timingLoading: false,
      timingSaving: false,
    };
  },
  mounted() {
    if (checkPermi(['admin:system:config:info'])) {
      this.getFormInfo();
      this.loadTiming();
    }
  },
  methods: {
    resetForm(formValue) {
      this.editData = {};
    },
    loadTiming() {
      this.timingLoading = true;
      configGetUniq({ key: 'integral_credit_timing' })
        .then((res) => {
          this.integralCreditTiming = res || '1';
        })
        .catch(() => {
          this.integralCreditTiming = '1';
        })
        .finally(() => {
          this.timingLoading = false;
        });
    },
    saveTiming() {
      this.timingSaving = true;
      configSaveUniq({ key: 'integral_credit_timing', value: this.integralCreditTiming })
        .then(() => {
          this.$message.success('保存成功');
        })
        .finally(() => {
          this.timingSaving = false;
        });
    },
    handlerSubmit: Debounce(function (data) {
      const tempArr = [];
      for (var key in data) {
        const obj = {};
        obj.name = key;
        obj.title = key;
        obj.value = data[key];
        tempArr.push(obj);
      }
      const _pram = {
        fields: tempArr,
        id: this.formId,
        sort: 0,
        status: true,
      };
      configSaveForm(_pram).then((res) => {
        this.getFormInfo();
        this.$message.success('操作成功');
      });
    }),
    // 获取表单详情
    getFormInfo() {
      configInfo({ id: this.formId }).then((res) => {
        this.isShow = false;
        this.editData = res;
        this.isCreate = 1;
        setTimeout(() => {
          // 让表单重复渲染待编辑数据
          this.isShow = true;
        }, 80);
      });
    },
  },
};
</script>

<style scoped lang="scss">
.mb15 {
  margin-bottom: 15px;
}
.tip {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}
::v-deep .closeBtn {
  display: none;
}
::v-deep .el-form-item--medium .el-button + .el-button {
  margin-left: 200px !important;
}
</style>
